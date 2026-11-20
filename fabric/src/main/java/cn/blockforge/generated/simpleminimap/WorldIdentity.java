package cn.blockforge.generated.simpleminimap;

import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import net.minecraft.client.MinecraftClient;
import net.minecraft.client.network.ServerInfo;
import net.minecraft.client.world.ClientWorld;
import net.minecraft.server.MinecraftServer;
import net.minecraft.util.WorldSavePath;

public final class WorldIdentity {
    private WorldIdentity() {
    }

    public static String of(MinecraftClient client, ClientWorld world) {
        String dimension = world.getRegistryKey().getValue().toString();
        String base = "unknown";

        MinecraftServer server = client.getServer();
        if (server != null) {
            try {
                Path root = server.getSavePath(WorldSavePath.ROOT);
                Path name = root.getFileName();
                if (name != null) {
                    base = "singleplayer-" + name;
                }
            } catch (RuntimeException exception) {
                SimpleMinimapClient.LOGGER.warn("Could not read the integrated server save path", exception);
            }
        } else {
            ServerInfo info = client.getCurrentServerEntry();
            if (info != null && info.address != null && !info.address.isBlank()) {
                base = "multiplayer-" + info.address;
            }
        }

        String raw = base + "|" + dimension;
        String safe = raw.replaceAll("[^A-Za-z0-9._-]+", "_");
        if (safe.length() > 48) {
            safe = safe.substring(0, 48);
        }
        if (safe.isEmpty()) {
            safe = "world";
        }
        return safe + "-" + shortHash(raw);
    }

    private static String shortHash(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash).substring(0, 12);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is required by the Java runtime", exception);
        }
    }
}
