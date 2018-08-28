package jk.kamoru.flayground.flay.domain;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Actress {
	
	boolean favorite;
	String  name;
	String  localName;
	String  birth;
	String  body;
	Integer height;
	Integer debut;
	String  comment;
	
	public Actress(String name) {
		this.name = name;
	}

}
