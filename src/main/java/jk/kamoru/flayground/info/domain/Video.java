package jk.kamoru.flayground.info.domain;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import javax.validation.constraints.NotNull;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class Video implements Info<String> {

	@NotNull
	String opus;
	int play;
	int rank;
	String comment;
	Date lastAccess;
	List<Tag> tags;

	public Video(String key) {
		setKey(key);
		this.play = 0;
		this.rank = 0;
		this.comment = "";
		this.lastAccess = new Date(0);
		tags = new ArrayList<>();
	}

	@Override
	public String getKey() {
		return opus;
	}

	@Override
	public void setKey(String key) {
		this.opus = key;
	}

}
