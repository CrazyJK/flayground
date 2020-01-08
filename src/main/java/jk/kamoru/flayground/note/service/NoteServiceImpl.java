package jk.kamoru.flayground.note.service;

import java.util.Collection;
import java.util.stream.Collectors;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jk.kamoru.flayground.note.domain.Note;
import jk.kamoru.flayground.note.source.NoteSource;

@Service
public class NoteServiceImpl implements NoteService {

	@Autowired NoteSource noteSource;
	
	@Override
	public Note get(long id) {
		Note note = new Note();
		note.setId(id);
		return noteSource.get(note);
	}

	@Override
	public Collection<Note> list() {
		return noteSource.list();
	}

	@Override
	public Collection<Note> find(Note note) {
		return noteSource.list().stream().filter(n -> {
			boolean result = false;
			if (note.getId() > 0)
				result = result & note.getId() == n.getId();
			if (StringUtils.isNotBlank(note.getTitle()))
				result = result & StringUtils.containsIgnoreCase(n.getTitle(), note.getTitle());
			if (StringUtils.isNotBlank(note.getContent()))
				result = result & StringUtils.containsIgnoreCase(n.getContent(), note.getContent());
			if (note.getStatus() != null)
				result = result & n.getStatus() == note.getStatus();
				
			return result;
		}).collect(Collectors.toList());
	}

	@Override
	public void persist(Note note) {
		noteSource.save(note);
	}

	@Override
	public void delete(Note note) {
		noteSource.delete(note);
	}

}
