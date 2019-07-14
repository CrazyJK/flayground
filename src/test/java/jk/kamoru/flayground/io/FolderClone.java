package jk.kamoru.flayground.io;

import java.io.File;

import jk.kamoru.flayground.flay.service.FlayFileHandler;

public class FolderClone {

	public static void main(String[] args) {
		File srcFolder  = new File("J:\\Crazy\\Stage\\2019");
		File destFolder = new File("K:\\Crazy\\Stage\\2019");

		FlayFileHandler flayFileHandler = new FlayFileHandler();
		flayFileHandler.cloneFolder(srcFolder, destFolder);
	}

}
