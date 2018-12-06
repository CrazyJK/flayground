package jk.kamoru.flayground.web.notice.domain;

import java.util.Date;
import java.util.concurrent.atomic.AtomicInteger;

import lombok.Getter;

@Getter
public class Notice {

	private static final AtomicInteger integer = new AtomicInteger();
	
	long time;
	String title;
	String content;
	
	public Notice(String title) {
		this(title, "");
	}

	public Notice(String title, String content) {
		this.time = new Date().getTime();
		this.title = title;
		this.content = content;
	}

	public Integer getIndex() {
		return integer.incrementAndGet();
	}
	
}
