package cn.blockforge.generated.simpleminimap;

import java.util.HashMap;
import java.util.Map;
import net.minecraft.util.math.ChunkPos;

public final class ExplorationStore {
    private final Map<Long, int[]> chunks;
    private long revision;
    private long savedRevision;

    public ExplorationStore() {
        this.chunks = new HashMap<>();
    }

    public ExplorationStore(Map<Long, int[]> loaded) {
        this.chunks = new HashMap<>(loaded);
    }

    public synchronized boolean hasChunk(long key) {
        return chunks.containsKey(key);
    }

    public synchronized void put(long key, int[] colors) {
        if (colors.length != 256) {
            throw new IllegalArgumentException("A chunk color array must contain 256 entries");
        }
        if (chunks.putIfAbsent(key, colors) == null) {
            revision++;
        }
    }

    public synchronized int colorAt(int blockX, int blockZ) {
        // 必须与写入端 ChunkColorSampler 用的 ChunkPos.toLong 完全一致：
        // 位打包格式是官方实现细节（低 32 位 x、高 32 位 z），自己拼会拼出对不上的键，
        // 结果是整张小地图查不到区块、只剩空白。
        long key = ChunkPos.toLong(blockX >> 4, blockZ >> 4);
        int[] colors = chunks.get(key);
        if (colors == null) {
            return 0;
        }
        int index = ((blockZ & 15) << 4) | (blockX & 15);
        return colors[index];
    }

    public synchronized long revision() {
        return revision;
    }

    public synchronized boolean isDirty() {
        return revision != savedRevision;
    }

    public synchronized Map<Long, int[]> snapshot() {
        Map<Long, int[]> copy = new HashMap<>(chunks.size());
        for (Map.Entry<Long, int[]> entry : chunks.entrySet()) {
            copy.put(entry.getKey(), entry.getValue().clone());
        }
        return copy;
    }

    public synchronized void markSaved(long revisionWritten) {
        if (revisionWritten > savedRevision) {
            savedRevision = revisionWritten;
        }
    }

    public synchronized int chunkCount() {
        return chunks.size();
    }
}
