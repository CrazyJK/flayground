package jk.kamoru.flayground.todayis.domain;

import java.io.File;

import com.fasterxml.jackson.annotation.JsonIgnore;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class Todayis {

	String name;
	String path;
	long length;
	@JsonIgnore long lastModified;
	
	public Todayis(File file) {
		this.name = file.getName();
		this.path = file.getParent();
		this.length = file.length();
		this.lastModified = file.lastModified();
	}

	@JsonIgnore
	public String getFilePath() {
		return path + File.separator + name;
	}
}
