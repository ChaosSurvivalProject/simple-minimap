package cn.blockforge.generated.simpleminimap;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.nio.file.StandardOpenOption;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

final class StorageIO {
    private static final int EXPLORATION_MAGIC = 0x534d4d31;
    private static final int EXPLORATION_VERSION = 1;
    private static final int MAX_CHUNKS = 262_144;
    private static final int MARKER_VERSION = 1;

    private StorageIO() {
    }

    static ExplorationStore loadExploration(Path directory) {
        Path file = directory.resolve("explored.bin");
        if (!Files.isRegularFile(file)) {
            return new ExplorationStore();
        }

        try (DataInputStream input = new DataInputStream(
                new BufferedInputStream(Files.newInputStream(file)))) {
            if (input.readInt() != EXPLORATION_MAGIC) {
                throw new IOException("Unexpected exploration file magic");
            }
            int version = input.readInt();
            if (version != EXPLORATION_VERSION) {
                throw new IOException("Unsupported exploration file version: " + version);
            }
            int count = input.readInt();
            if (count < 0 || count > MAX_CHUNKS) {
                throw new IOException("Invalid exploration chunk count: " + count);
            }

            Map<Long, int[]> chunks = new HashMap<>(count);
            for (int index = 0; index < count; index++) {
                long key = input.readLong();
                int[] colors = new int[256];
                for (int colorIndex = 0; colorIndex < colors.length; colorIndex++) {
                    colors[colorIndex] = input.readInt();
                }
                chunks.put(key, colors);
            }
            return new ExplorationStore(chunks);
        } catch (IOException | RuntimeException exception) {
            SimpleMinimapClient.LOGGER.warn("Ignoring unreadable exploration data at {}", file, exception);
            return new ExplorationStore();
        }
    }

    static void writeExploration(Path directory, Map<Long, int[]> chunks) throws IOException {
        Files.createDirectories(directory);
        Path target = directory.resolve("explored.bin");
        Path temporary = directory.resolve("explored.bin.tmp");

        try (DataOutputStream output = new DataOutputStream(
                new BufferedOutputStream(Files.newOutputStream(
                        temporary,
                        StandardOpenOption.CREATE,
                        StandardOpenOption.TRUNCATE_EXISTING,
                        StandardOpenOption.WRITE)))) {
            output.writeInt(EXPLORATION_MAGIC);
            output.writeInt(EXPLORATION_VERSION);
            output.writeInt(chunks.size());
            for (Map.Entry<Long, int[]> entry : chunks.entrySet()) {
                output.writeLong(entry.getKey());
                int[] colors = entry.getValue();
                for (int index = 0; index < 256; index++) {
                    output.writeInt(colors[index]);
                }
            }
        }

        moveAtomically(temporary, target);
    }

    static MarkerStore loadMarkers(Path directory) {
        Path file = directory.resolve("markers.json");
        if (!Files.isRegularFile(file)) {
            return new MarkerStore();
        }

        try {
            JsonElement parsed = JsonParser.parseString(Files.readString(file, StandardCharsets.UTF_8));
            if (!parsed.isJsonObject()) {
                throw new IOException("Marker file root is not an object");
            }
            JsonObject root = parsed.getAsJsonObject();
            JsonArray array = root.has("markers") ? root.getAsJsonArray("markers") : new JsonArray();
            List<Marker> markers = new ArrayList<>();
            for (JsonElement element : array) {
                if (!element.isJsonObject()) {
                    continue;
                }
                JsonObject object = element.getAsJsonObject();
                if (!object.has("name") || !object.has("x") || !object.has("y") || !object.has("z")) {
                    continue;
                }
                String name = object.get("name").getAsString().trim();
                if (name.isEmpty()) {
                    continue;
                }
                if (name.length() > 32) {
                    name = name.substring(0, 32);
                }
                markers.add(new Marker(
                        name,
                        object.get("x").getAsInt(),
                        object.get("y").getAsInt(),
                        object.get("z").getAsInt()
                ));
            }
            return new MarkerStore(markers);
        } catch (IOException | RuntimeException exception) {
            SimpleMinimapClient.LOGGER.warn("Ignoring unreadable marker data at {}", file, exception);
            return new MarkerStore();
        }
    }

    static void writeMarkers(Path directory, List<Marker> markers) throws IOException {
        Files.createDirectories(directory);
        JsonObject root = new JsonObject();
        root.addProperty("version", MARKER_VERSION);
        JsonArray array = new JsonArray();
        for (Marker marker : markers) {
            JsonObject object = new JsonObject();
            object.addProperty("name", marker.name());
            object.addProperty("x", marker.x());
            object.addProperty("y", marker.y());
            object.addProperty("z", marker.z());
            array.add(object);
        }
        root.add("markers", array);

        Path target = directory.resolve("markers.json");
        Path temporary = directory.resolve("markers.json.tmp");
        Files.writeString(
                temporary,
                root.toString(),
                StandardCharsets.UTF_8,
                StandardOpenOption.CREATE,
                StandardOpenOption.TRUNCATE_EXISTING,
                StandardOpenOption.WRITE
        );
        moveAtomically(temporary, target);
    }

    private static void moveAtomically(Path temporary, Path target) throws IOException {
        try {
            Files.move(temporary, target, StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING);
        } catch (AtomicMoveNotSupportedException exception) {
            Files.move(temporary, target, StandardCopyOption.REPLACE_EXISTING);
        }
    }
}
