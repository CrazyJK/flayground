package jk.kamoru.flayground.note;

import java.util.Collection;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jk.kamoru.flayground.note.domain.Note;
import jk.kamoru.flayground.note.service.NoteService;

@RestController
@RequestMapping("/info/note")
public class NoteController {

	@Autowired NoteService noteService;

	@GetMapping("/{id}")
	public Note get(@PathVariable long id) {
		return noteService.get(id);
	}

	@GetMapping("/all")
	public Collection<Note> all() {
		return noteService.all();
	}

	@GetMapping("/list")
	public Collection<Note> list() {
		return noteService.list();
	}

	@PatchMapping("/find")
	public Collection<Note> find(@RequestBody Note note) {
		return noteService.find(note);
	}

	@PutMapping
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void persist(@RequestBody Note note) {
		noteService.persist(note);
	}

	@DeleteMapping
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void delete(@RequestBody Note note) {
		noteService.delete(note);
	}

}
