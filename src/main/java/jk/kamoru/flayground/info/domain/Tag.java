package jk.kamoru.flayground.info.domain;

import javax.validation.constraints.NotNull;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class Tag implements Info<String> {

	@NotNull
	String name;
	String description;

	public Tag(String key) {
		setKey(key);
		this.description = "";
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
