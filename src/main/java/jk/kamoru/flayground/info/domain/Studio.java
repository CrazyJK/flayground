package jk.kamoru.flayground.info.domain;

import java.net.URL;

import javax.validation.constraints.NotBlank;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class Studio implements Info<String> {

	@NotBlank
	String name;
	String company;
	URL homepage;

	public Studio(String key) {
		setKey(key);
		this.company = "";
		this.homepage = null;
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
