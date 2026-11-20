package cn.blockforge.generated.simpleminimap;

public record Marker(String name, int x, int y, int z) {
    public Marker {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("A marker name must not be blank");
        }
        if (name.length() > 32) {
            throw new IllegalArgumentException("A marker name must not exceed 32 characters");
        }
    }
}
