package cn.blockforge.generated.simpleminimap;

import net.minecraft.client.MinecraftClient;
import net.minecraft.client.gui.DrawContext;
import net.minecraft.client.network.ClientPlayerEntity;
import net.minecraft.client.world.ClientWorld;

final class MinimapRenderer {
    private static final int MARGIN = 4;
    private static final int SIZE = 64;
    private static final int HALF = SIZE / 2;
    private static final int[] COLOR_CACHE = new int[SIZE * SIZE];

    private static long cachedGeneration = Long.MIN_VALUE;
    private static long cachedRevision = Long.MIN_VALUE;
    private static int cachedCenterX = Integer.MIN_VALUE;
    private static int cachedCenterZ = Integer.MIN_VALUE;

    private MinimapRenderer() {
    }

    static void render(DrawContext context, ClientWorldSession session) {
        MinecraftClient client = MinecraftClient.getInstance();
        if (session == null || !session.isActive() || client.options.hudHidden) {
            return;
        }
        ClientPlayerEntity player = client.player;
        ClientWorld world = client.world;
        if (player == null || world == null) {
            return;
        }

        int centerX = (int) Math.floor(player.getX());
        int centerZ = (int) Math.floor(player.getZ());
        long revision = session.exploration().revision();
        long generation = session.generation();

        if (generation != cachedGeneration
                || revision != cachedRevision
                || centerX != cachedCenterX
                || centerZ != cachedCenterZ) {
            rebuild(session, centerX, centerZ);
            cachedGeneration = generation;
            cachedRevision = revision;
            cachedCenterX = centerX;
            cachedCenterZ = centerZ;
        }

        // 同一行里连续同色的格子合并成一次 fill：地形大片的同色区域（一片草、一片水）
        // 让每帧的绘制调用从最坏 4096 次降到几十次，画面逐像素不变。
        for (int pixelZ = 0; pixelZ < SIZE; pixelZ++) {
            int rowBase = pixelZ * SIZE;
            int pixelX = 0;
            while (pixelX < SIZE) {
                int color = COLOR_CACHE[rowBase + pixelX];
                if ((color >>> 24) == 0) {
                    pixelX++;
                    continue;
                }

                int runEnd = pixelX + 1;
                while (runEnd < SIZE && COLOR_CACHE[rowBase + runEnd] == color) {
                    runEnd++;
                }

                int screenX = MARGIN + pixelX;
                int screenY = MARGIN + pixelZ;
                context.fill(screenX, screenY, MARGIN + runEnd, screenY + 1, color);
                pixelX = runEnd;
            }
        }

        int centerScreenX = MARGIN + HALF;
        int centerScreenY = MARGIN + HALF;
        context.fill(centerScreenX - 2, centerScreenY - 2, centerScreenX + 3, centerScreenY + 3, 0xff101010);
        context.fill(centerScreenX - 1, centerScreenY - 1, centerScreenX + 2, centerScreenY + 2, 0xffffffff);
    }

    private static void rebuild(ClientWorldSession session, int centerX, int centerZ) {
        ExplorationStore store = session.exploration();
        for (int pixelZ = 0; pixelZ < SIZE; pixelZ++) {
            for (int pixelX = 0; pixelX < SIZE; pixelX++) {
                int worldX = centerX - HALF + pixelX;
                int worldZ = centerZ - HALF + pixelZ;
                COLOR_CACHE[pixelZ * SIZE + pixelX] = store.colorAt(worldX, worldZ);
            }
        }
    }
}
