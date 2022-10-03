package jk.kamoru.flayground.note.source;

import jk.kamoru.flayground.Flayground;
import jk.kamoru.flayground.note.domain.Note;

public class NoteNotfoundException extends RuntimeException {

  private static final long serialVersionUID = Flayground.SERIAL_VERSION_UID;

  public NoteNotfoundException(Note note) {
    super("note id: " + String.valueOf(note.getId()));
  }

}
