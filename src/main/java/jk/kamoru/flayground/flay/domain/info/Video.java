package jk.kamoru.flayground.flay.domain.info;

import java.util.Date;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class Video implements Info<String> {

	String opus;
	Integer play;
	Integer rank;
	String comment;
	Date lastAccess;
	List<Tag> tagList;

	@Override
	public String getKey() {
		return opus;
	}
	@Override
	public void setKey(String key) {
		this.opus = key;
	}

}
