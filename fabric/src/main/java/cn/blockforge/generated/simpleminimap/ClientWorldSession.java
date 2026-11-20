package cn.blockforge.generated.simpleminimap;

import java.io.IOException;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import net.fabricmc.loader.api.FabricLoader;
import net.minecraft.client.MinecraftClient;
import net.minecraft.client.world.ClientWorld;
import net.minecraft.util.math.BlockPos;
import net.minecraft.util.math.ChunkPos;

public final class ClientWorldSession {
    private final MinecraftClient client;

    private ClientWorld world;
    private String worldId;
    private Path directory;
    private ExplorationStore exploration;
    private MarkerStore markers;
    private volatile long generation;
    private volatile boolean loading;
    private long lastCenterChunk = Long.MIN_VALUE;
    private int ticks;

    public ClientWorldSession(MinecraftClient client) {
        this.client = client;
    }

    public void tick() {
        ClientWorld current = client.world;
        if (current == null) {
            close();
            return;
        }

        String currentId = WorldIdentity.of(client, current);
        if (world != current || !currentId.equals(worldId)) {
            close();
            open(current, currentId);
        }

        // 磁盘加载还在后台跑：既不采样，也不渲染，避免用空数据覆盖存档。
        if (loading || client.player == null || exploration == null) {
            return;
        }

        BlockPos pos = client.player.getBlockPos();
        long centerChunk = ChunkPos.toLong(pos.getX() >> 4, pos.getZ() >> 4);
        if (centerChunk != lastCenterChunk || ticks % 20 == 0) {
            lastCenterChunk = centerChunk;
            ChunkColorSampler.sampleAround(current, pos, exploration);
        }

        ticks++;
        if (ticks >= 100) {
            ticks = 0;
            saveAsync();
        }
    }

    private void open(ClientWorld newWorld, String newId) {
        this.world = newWorld;
        this.worldId = newId;
        this.generation++;
        this.ticks = 0;
        this.lastCenterChunk = Long.MIN_VALUE;
        this.exploration = null;
        this.markers = null;
        this.directory = FabricLoader.getInstance().getConfigDir()
                .resolve(SimpleMinimapClient.MOD_ID)
                .resolve(newId);

        // §4 硬要求：渲染线程（= 客户端主线程）不读磁盘。读盘丢给存储线程，
        // 回到主线程再挂上；generation 变了说明玩家已经换世界，结果直接丢弃。
        final Path target = this.directory;
        final long expected = this.generation;
        this.loading = true;

        StorageExecutor.submit(() -> {
            ExplorationStore loadedExploration;
            MarkerStore loadedMarkers;
            try {
                loadedExploration = StorageIO.loadExploration(target);
                loadedMarkers = StorageIO.loadMarkers(target);
            } catch (RuntimeException exception) {
                SimpleMinimapClient.LOGGER.warn("Failed to load minimap data from {}", target, exception);
                loadedExploration = new ExplorationStore();
                loadedMarkers = new MarkerStore();
            }
            final ExplorationStore explorationToApply = loadedExploration;
            final MarkerStore markersToApply = loadedMarkers;

            client.execute(() -> {
                if (generation != expected) {
                    return;
                }
                this.exploration = explorationToApply;
                this.markers = markersToApply;
                this.loading = false;
                SimpleMinimapClient.LOGGER.info(
                        "Minimap session opened for {} ({} explored chunks)", newId, explorationToApply.chunkCount());
            });
        });
    }

    private void close() {
        if (exploration != null && markers != null) {
            saveAsync();
        }
        // 递增 generation，让仍在排队里的加载结果作废，不会在离场后把数据挂回来。
        this.generation++;
        loading = false;
        world = null;
        worldId = null;
        directory = null;
        exploration = null;
        markers = null;
        lastCenterChunk = Long.MIN_VALUE;
    }

    public void saveAsync() {
        ExplorationStore explorationStore = exploration;
        MarkerStore markerStore = markers;
        Path targetDirectory = directory;
        if (explorationStore == null || markerStore == null || targetDirectory == null) {
            return;
        }

        Map<Long, int[]> explorationSnapshot = null;
        List<Marker> markerSnapshot = null;
        long explorationRevision = -1L;
        long markerRevision = -1L;

        if (explorationStore.isDirty()) {
            explorationRevision = explorationStore.revision();
            explorationSnapshot = explorationStore.snapshot();
        }
        if (markerStore.isDirty()) {
            markerRevision = markerStore.revision();
            markerSnapshot = markerStore.snapshot();
        }
        if (explorationSnapshot == null && markerSnapshot == null) {
            return;
        }

        Map<Long, int[]> explorationToWrite = explorationSnapshot;
        List<Marker> markersToWrite = markerSnapshot;
        long explorationRevisionToWrite = explorationRevision;
        long markerRevisionToWrite = markerRevision;

        StorageExecutor.submit(() -> {
            try {
                if (explorationToWrite != null) {
                    StorageIO.writeExploration(targetDirectory, explorationToWrite);
                    explorationStore.markSaved(explorationRevisionToWrite);
                }
                if (markersToWrite != null) {
                    StorageIO.writeMarkers(targetDirectory, markersToWrite);
                    markerStore.markSaved(markerRevisionToWrite);
                }
            } catch (IOException exception) {
                SimpleMinimapClient.LOGGER.error("Failed to save minimap data to {}", targetDirectory, exception);
            }
        });
    }

    public void flush() {
        saveAsync();
        StorageExecutor.flush();
    }

    public boolean isActive() {
        return exploration != null && markers != null && world != null;
    }

    public ExplorationStore exploration() {
        return exploration;
    }

    public MarkerStore markers() {
        return markers;
    }

    public long generation() {
        return generation;
    }
}
