package jk.kamoru.flayground.note.service;

import java.util.Collection;

import jk.kamoru.flayground.note.domain.Note;

public interface NoteService {

	Note get(long id);

	/**
	 * 현재 사용자의 노트
	 * @param admin
	 * @return
	 */
	Collection<Note> list(boolean admin);

	/**
	 * 조건 맞는 노트
	 * @param note
	 * @param admin
	 * @return
	 */
	Collection<Note> find(Note note, boolean admin);

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