package jk.kamoru.flayground.flay.domain;

import lombok.Data;

@Data
public class Actress {
	
	boolean favorite;
	String name;
	String localName;
	String birth;
	String body;
	int height;
	int debut;
	String comment;
	
	public Actress(String name) {
		this.name = name;
	}

}
