package jk.kamoru.flayground.flay.domain.info;

import java.io.File;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class Actress implements Info<String> {

	String name;
	String localName;
	String birth;
	String body;
	Integer height;
	Integer debut;
	String comment;
	File cover;
	boolean favorite;
	
	public Actress(String name) {
		this.name = name;
	}

	@Override
	public String getKey() {
		return name;
	}

	@Override
	public void setKey(String key) {
		this.name = key;
	}

}
