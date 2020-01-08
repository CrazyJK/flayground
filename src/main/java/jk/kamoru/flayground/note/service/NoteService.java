package jk.kamoru.flayground.note.service;

import java.util.Collection;

import jk.kamoru.flayground.note.domain.Note;

public interface NoteService {

	Note get(long id);

	/**
	 * 전체 노트
	 * @return
	 */
	Collection<Note> list();

	/**
	 * 조건 맞는 노트
	 * @param note
	 * @return
	 */
	Collection<Note> find(Note note);

	/**
	 * 새 노트 저장
	 * @param note
	 */
	void persist(Note note);

	/**
	 * 노트 삭제
	 * @param note
	 */
	void delete(Note note);

}