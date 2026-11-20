package cn.blockforge.generated.simpleminimap;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

final class StorageExecutor {
    private static final ExecutorService EXECUTOR = Executors.newSingleThreadExecutor(task -> {
        Thread thread = new Thread(task, "simple-minimap-storage");
        thread.setDaemon(true);
        return thread;
    });

    private StorageExecutor() {
    }

    static void submit(Runnable task) {
        EXECUTOR.execute(() -> {
            try {
                task.run();
            } catch (RuntimeException exception) {
                SimpleMinimapClient.LOGGER.error("Minimap storage task failed", exception);
            }
        });
    }

    static void flush() {
        try {
            Future<?> barrier = EXECUTOR.submit(() -> {
            });
            barrier.get(5L, TimeUnit.SECONDS);
        } catch (Exception exception) {
            SimpleMinimapClient.LOGGER.warn("Timed out while flushing minimap storage", exception);
        }
    }
}
