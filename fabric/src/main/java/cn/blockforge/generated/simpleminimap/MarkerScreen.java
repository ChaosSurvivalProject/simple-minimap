package cn.blockforge.generated.simpleminimap;

import java.util.ArrayList;
import java.util.List;
import net.minecraft.client.MinecraftClient;
import net.minecraft.client.gui.DrawContext;
import net.minecraft.client.gui.screen.Screen;
import net.minecraft.client.gui.widget.ButtonWidget;
import net.minecraft.client.gui.widget.TextFieldWidget;
import net.minecraft.text.Text;
import net.minecraft.util.math.BlockPos;

public final class MarkerScreen extends Screen {
    private final ClientWorldSession session;
    private final List<Marker> markers;
    private final BlockPos anchor;

    private TextFieldWidget nameField;
    private ButtonWidget previousButton;
    private ButtonWidget nextButton;
    private ButtonWidget renameButton;
    private ButtonWidget deleteButton;
    private int index;

    public MarkerScreen(ClientWorldSession session) {
        super(Text.translatable("screen.simple_minimap.markers"));
        this.session = session;
        this.markers = new ArrayList<>(session.markers().snapshot());
        MinecraftClient client = MinecraftClient.getInstance();
        this.anchor = client.player == null ? BlockPos.ORIGIN : client.player.getBlockPos();
        this.index = 0;
    }

    @Override
    protected void init() {
        int centerX = this.width / 2;

        this.nameField = new TextFieldWidget(
                this.textRenderer,
                centerX - 102,
                40,
                204,
                20,
                Text.translatable("screen.simple_minimap.name")
        );
        this.nameField.setMaxLength(32);
        this.nameField.setPlaceholder(Text.translatable("screen.simple_minimap.name"));
        this.addDrawableChild(this.nameField);
        this.setInitialFocus(this.nameField);

        ButtonWidget addButton = ButtonWidget.builder(
                        Text.translatable("screen.simple_minimap.add"),
                        button -> addMarker()
                )
                .position(centerX - 102, 66)
                .width(204)
                .build();
        this.addDrawableChild(addButton);

        this.previousButton = ButtonWidget.builder(
                        Text.translatable("screen.simple_minimap.previous"),
                        button -> moveSelection(-1)
                )
                .position(centerX - 102, 94)
                .width(98)
                .build();
        this.addDrawableChild(this.previousButton);

        this.nextButton = ButtonWidget.builder(
                        Text.translatable("screen.simple_minimap.next"),
                        button -> moveSelection(1)
                )
                .position(centerX + 4, 94)
                .width(98)
                .build();
        this.addDrawableChild(this.nextButton);

        this.renameButton = ButtonWidget.builder(
                        Text.translatable("screen.simple_minimap.rename"),
                        button -> renameCurrent()
                )
                .position(centerX - 102, 122)
                .width(98)
                .build();
        this.addDrawableChild(this.renameButton);

        this.deleteButton = ButtonWidget.builder(
                        Text.translatable("screen.simple_minimap.delete"),
                        button -> deleteCurrent()
                )
                .position(centerX + 4, 122)
                .width(98)
                .build();
        this.addDrawableChild(this.deleteButton);

        if (!this.markers.isEmpty()) {
            this.nameField.setText(this.markers.get(this.index).name());
        }
        refreshButtons();
    }

    @Override
    public void render(DrawContext context, int mouseX, int mouseY, float delta) {
        super.render(context, mouseX, mouseY, delta);

        context.drawCenteredTextWithShadow(this.textRenderer, this.title, this.width / 2, 16, 0xffffffff);

        String currentName = this.markers.isEmpty()
                ? Text.translatable("screen.simple_minimap.empty").getString()
                : this.markers.get(this.index).name();
        context.drawCenteredTextWithShadow(
                this.textRenderer,
                Text.literal(currentName),
                this.width / 2,
                154,
                0xffffffff
        );
    }

    @Override
    public void removed() {
        this.session.saveAsync();
    }

    private void addMarker() {
        String name = this.nameField.getText().trim();
        if (name.isEmpty()) {
            name = Text.translatable("screen.simple_minimap.default").getString() + " " + (this.markers.size() + 1);
        }
        if (name.length() > 32) {
            name = name.substring(0, 32);
        }

        this.markers.add(new Marker(name, this.anchor.getX(), this.anchor.getY(), this.anchor.getZ()));
        this.index = this.markers.size() - 1;
        this.nameField.setText(name);
        commit();
    }

    private void renameCurrent() {
        if (this.markers.isEmpty()) {
            return;
        }
        String name = this.nameField.getText().trim();
        if (name.isEmpty()) {
            name = this.markers.get(this.index).name();
        }
        if (name.length() > 32) {
            name = name.substring(0, 32);
        }

        Marker old = this.markers.get(this.index);
        this.markers.set(this.index, new Marker(name, old.x(), old.y(), old.z()));
        this.nameField.setText(name);
        commit();
    }

    private void deleteCurrent() {
        if (this.markers.isEmpty()) {
            return;
        }

        this.markers.remove(this.index);
        if (this.markers.isEmpty()) {
            this.index = 0;
            this.nameField.setText("");
        } else {
            this.index = Math.min(this.index, this.markers.size() - 1);
            this.nameField.setText(this.markers.get(this.index).name());
        }
        commit();
    }

    private void moveSelection(int direction) {
        if (this.markers.isEmpty()) {
            return;
        }
        this.index = Math.floorMod(this.index + direction, this.markers.size());
        this.nameField.setText(this.markers.get(this.index).name());
        refreshButtons();
    }

    private void commit() {
        this.session.markers().replaceAll(this.markers);
        this.session.saveAsync();
        refreshButtons();
    }

    private void refreshButtons() {
        boolean hasMarkers = !this.markers.isEmpty();
        this.previousButton.active = hasMarkers && this.markers.size() > 1;
        this.nextButton.active = hasMarkers && this.markers.size() > 1;
        this.renameButton.active = hasMarkers;
        this.deleteButton.active = hasMarkers;
    }
}
