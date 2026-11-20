package cn.blockforge.generated.simpleminimap;

import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.fabric.api.client.event.lifecycle.v1.ClientLifecycleEvents;
import net.fabricmc.fabric.api.client.event.lifecycle.v1.ClientTickEvents;
import net.fabricmc.fabric.api.client.keybinding.v1.KeyBindingHelper;
import net.fabricmc.fabric.api.client.rendering.v1.HudRenderCallback;
import net.minecraft.client.MinecraftClient;
import net.minecraft.client.option.KeyBinding;
import net.minecraft.client.util.InputUtil;
import org.lwjgl.glfw.GLFW;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@SuppressWarnings("deprecation")
public final class SimpleMinimapClient implements ClientModInitializer {
    public static final String MOD_ID = "simple_minimap";
    public static final Logger LOGGER = LoggerFactory.getLogger(MOD_ID);

    private static ClientWorldSession session;
    private static KeyBinding markerKey;

    @Override
    public void onInitializeClient() {
        session = new ClientWorldSession(MinecraftClient.getInstance());

        markerKey = KeyBindingHelper.registerKeyBinding(new KeyBinding(
                "key.simple_minimap.markers",
                InputUtil.Type.KEYSYM,
                GLFW.GLFW_KEY_M,
                KeyBinding.Category.MISC
        ));

        ClientTickEvents.END_CLIENT_TICK.register(client -> {
            session.tick();

            if (markerKey.wasPressed()
                    && client.currentScreen == null
                    && session.isActive()
                    && client.player != null
                    && client.world != null) {
                client.setScreen(new MarkerScreen(session));
            }
        });

        // Fabric API 0.141.6+1.21.11 官方 Javadoc: HudRenderCallback 已弃用，
        // 但仍存在且签名为 (GuiGraphics, DeltaTracker) —— 在 Yarn build.6 中对应
        // (DrawContext, RenderTickCounter)。任务约束要求使用该回调，故保留；
        // 不使用 Mixin InGameHud，也不以 Screen.render 伪装 HUD。
        HudRenderCallback.EVENT.register((context, tickCounter) -> MinimapRenderer.render(context, session));

        ClientLifecycleEvents.CLIENT_STOPPING.register(client -> session.flush());
    }

    public static ClientWorldSession session() {
        return session;
    }
}
