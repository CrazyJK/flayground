package jk.kamoru.flayground.flay.domain;

import java.net.URL;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Studio {

	String name;
	URL    homepage;
	String company;

	public Studio(String name) {
		this.name = name;
	}

}
