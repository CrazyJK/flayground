package jk.kamoru.flayground.note.service;

import java.util.Collection;
import java.util.Date;
import java.util.stream.Collectors;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import jk.kamoru.flayground.note.domain.Note;
import jk.kamoru.flayground.note.source.NoteSource;
import lombok.extern.slf4j.Slf4j;

@Slf4j
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
	public Collection<Note> list(boolean admin) {
		if (admin) {
			return noteSource.list();
		} else {
			return noteSource.list().stream().filter(n -> getUsername().equals(n.getAuthor())).toList();
		}
	}

	@Override
	public Collection<Note> find(Note note, boolean admin) {
		log.info("find by id:{} title:{}, content:{}, admin:{}", note.getId(), note.getTitle(), note.getContent(), admin);
		return list(admin).stream().filter(n -> {
			boolean result = false;
			if (note.getId() > 0)
				result = result | note.getId() == n.getId();
			if (StringUtils.isNotBlank(note.getTitle()))
				result = result | StringUtils.containsIgnoreCase(n.getTitle(), note.getTitle());
			if (StringUtils.isNotBlank(note.getContent()))
				result = result | StringUtils.containsIgnoreCase(n.getContent(), note.getContent());
			if (note.getStatus() != null)
				result = result & n.getStatus() == note.getStatus();

			return result;
		}).collect(Collectors.toList());
	}

	@Override
	public void persist(Note note) {
		if (note.getAuthor() == null) {
			note.setAuthor(getUsername());
		}
		if (note.getCreated() == null) {
			note.setCreated(new Date());
		}
		if (note.getStatus() == null) {
			note.setStatus(Note.Status.N);
		}
		if (note.getStatus() == Note.Status.D) {
			if (note.getClosed() == null)
				note.setClosed(new Date());
		} else if (note.getStatus() == Note.Status.N) {
			if (note.getClosed() != null)
				note.setClosed(null);
		} else {
			throw new IllegalStateException("note status illegal stataus " + note);
		}
		noteSource.save(note);
	}

	@Override
	public void delete(Note note) {
		noteSource.delete(note);
	}

	String getUsername() {
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		return authentication.getName();
	}

}
