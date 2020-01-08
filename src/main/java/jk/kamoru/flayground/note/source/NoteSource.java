package jk.kamoru.flayground.note.source;

import java.util.List;

import jk.kamoru.flayground.note.domain.Note;

public interface NoteSource {

	Note get(Note note);

	List<Note> list();

	void save(Note note);

	void delete(Note note);

}
