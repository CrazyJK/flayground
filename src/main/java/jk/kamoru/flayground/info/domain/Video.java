package jk.kamoru.flayground.info.domain;

import java.util.ArrayList;
import java.util.List;
import javax.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class Video implements Info<String> {

	@NotBlank String opus;

	int play = 0;
	int rank = 0;
	long lastAccess = 0;
	String comment = "";
	String title = "";
	String desc = "";
	List<Tag> tags = new ArrayList<>();

	public Video(String key) {
		setKey(key);
		this.play = 0;
		this.rank = 0;
		this.lastAccess = 0;
		this.comment = "";
		this.title = "";
		this.desc = "";
		this.tags = new ArrayList<>();
	}

	@Override
	public String getKey() {
		return opus;
	}

	@Override
	public void setKey(String key) {
		this.opus = key;
	}

	public void increasePlayCount() {
		++play;
	}

}
