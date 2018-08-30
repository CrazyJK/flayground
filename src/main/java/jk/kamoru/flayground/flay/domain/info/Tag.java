package jk.kamoru.flayground.flay.domain.info;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class Tag implements Info<String> {

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
