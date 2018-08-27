package jk.kamoru.flayground.flay.domain;

import java.net.URL;

import lombok.Data;

@Data
public class Studio {

	String name;
	URL    homepage;
	String company;

	public Studio(String name) {
		this.name = name;
	}

}
