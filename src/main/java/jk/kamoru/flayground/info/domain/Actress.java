package jk.kamoru.flayground.info.domain;

import java.io.File;

import javax.validation.constraints.NotNull;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class Actress implements Info<String> {

	@NotNull
	String name;
	String localName;
	String birth;
	String body;
	int height;
	int debut;
	String comment;
	boolean favorite;
	File cover;
	
	public Actress(String name) {
		setKey(name);
		this.localName = "";
		this.birth = "";
		this.body = "";
		this.height = 0;
		this.debut = 0;
		this.comment = "";
		this.favorite = false;
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
