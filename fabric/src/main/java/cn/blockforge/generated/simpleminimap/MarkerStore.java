package cn.blockforge.generated.simpleminimap;

import java.util.ArrayList;
import java.util.List;

public final class MarkerStore {
    private final List<Marker> markers;
    private long revision;
    private long savedRevision;

    public MarkerStore() {
        this.markers = new ArrayList<>();
    }

    public MarkerStore(List<Marker> loaded) {
        this.markers = new ArrayList<>(loaded);
    }

    public synchronized List<Marker> snapshot() {
        return List.copyOf(markers);
    }

    public synchronized void replaceAll(List<Marker> updated) {
        markers.clear();
        markers.addAll(updated);
        revision++;
    }

    public synchronized long revision() {
        return revision;
    }

    public synchronized boolean isDirty() {
        return revision != savedRevision;
    }

    public synchronized void markSaved(long revisionWritten) {
        if (revisionWritten > savedRevision) {
            savedRevision = revisionWritten;
        }
    }
}
