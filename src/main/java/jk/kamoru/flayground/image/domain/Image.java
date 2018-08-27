package jk.kamoru.flayground.image.domain;

import java.io.File;

import lombok.Getter;

@Getter
public class Image {
	
	String name;
	String path;
	long length;
	long modified;
	File file;

	public Image(File file) {
		this.name = file.getName();
		this.path = file.getParent();
		this.length = file.length();
		this.modified = file.lastModified();
		this.file = file;
	}

}
