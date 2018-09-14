package jk.kamoru.flayground.info.domain;

import java.text.MessageFormat;

import jk.kamoru.flayground.FlayConfig;
import lombok.Data;

@Data
public class History implements Info<Long> {

	public static enum Action {
		PLAY, DELETE, OVERVIEW, SUBTITLES, REMOVE;
	}
	
	Long id;
	String date;
	String opus;
	Action action;
	String desc;

	public History() {}

	public History(Action action, String opus, String desc) {
		this.action = action;
		this.opus = opus;
		this.desc = desc;
	}

	@Override
	public Long getKey() {
		return id;
	}

	@Override
	public void setKey(Long key) {
		this.id = key;
	}

	public String toFileSaveString() {
		return MessageFormat.format("{0}, {1}, {2}, \"{3}\"{4}", date, opus, action, desc, FlayConfig.LINE);
	}

}
