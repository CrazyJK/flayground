package jk.kamoru.flayground.note.domain;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class Note {

	long id;
	String title;
	String content;
	Position position;
	Size size;
	boolean windowMinimized;
	Status status;
	
	@Data
	public static class Position {
		int left;
		int top;
	}
	
	@Data
	public static class Size {
		String width;
		String height;
	}
	
	public static enum Status {
		N, D;
	}
}
