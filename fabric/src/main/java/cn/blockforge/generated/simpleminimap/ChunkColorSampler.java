package cn.blockforge.generated.simpleminimap;

import net.minecraft.block.BlockState;
import net.minecraft.block.MapColor;
import net.minecraft.client.world.ClientWorld;
import net.minecraft.util.math.BlockPos;
import net.minecraft.util.math.ChunkPos;
import net.minecraft.world.Heightmap;
import net.minecraft.world.chunk.WorldChunk;

final class ChunkColorSampler {
    private ChunkColorSampler() {
    }

    static void sampleAround(ClientWorld world, BlockPos center, ExplorationStore store) {
        int centerX = center.getX() >> 4;
        int centerZ = center.getZ() >> 4;

        for (int offsetZ = -1; offsetZ <= 1; offsetZ++) {
            for (int offsetX = -1; offsetX <= 1; offsetX++) {
                int chunkX = centerX + offsetX;
                int chunkZ = centerZ + offsetZ;
                if (!world.isChunkLoaded(chunkX, chunkZ)) {
                    continue;
                }

                long key = ChunkPos.toLong(chunkX, chunkZ);
                if (store.hasChunk(key)) {
                    continue;
                }

                WorldChunk chunk = world.getChunk(chunkX, chunkZ);
                if (chunk == null) {
                    continue;
                }

                int[] colors = new int[256];
                for (int localZ = 0; localZ < 16; localZ++) {
                    for (int localX = 0; localX < 16; localX++) {
                        int worldX = (chunkX << 4) + localX;
                        int worldZ = (chunkZ << 4) + localZ;
                        int top = world.getTopY(Heightmap.Type.WORLD_SURFACE, worldX, worldZ);

                        int surfaceY = Integer.MIN_VALUE;
                        BlockState surface = null;
                        for (int depth = 0; depth < 16; depth++) {
                            int y = top - depth;
                            if (y < world.getBottomY()) {
                                break;
                            }
                            BlockState candidate = chunk.getBlockState(new BlockPos(worldX, y, worldZ));
                            if (!candidate.isAir()) {
                                surface = candidate;
                                surfaceY = y;
                                break;
                            }
                        }

                        if (surface == null) {
                            continue;
                        }

                        BlockPos surfacePos = new BlockPos(worldX, surfaceY, worldZ);
                        MapColor mapColor = surface.getMapColor(world, surfacePos);
                        if (mapColor == MapColor.CLEAR) {
                            continue;
                        }

                        int rgb = mapColor.getRenderColor(MapColor.Brightness.NORMAL) & 0x00ffffff;
                        colors[(localZ << 4) | localX] = 0xff000000 | rgb;
                    }
                }

                store.put(key, colors);
            }
        }
    }
}
