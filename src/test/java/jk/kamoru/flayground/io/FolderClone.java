package jk.kamoru.flayground.io;

import java.io.File;
import org.junit.jupiter.api.Test;
import jk.kamoru.flayground.flay.service.FlayFileHandler;

public class FolderClone {

	@Test
	void test() {
		File srcFolder = new File("J:\\Crazy\\Stage\\2019X");
		File destFolder = new File("K:\\Crazy\\Stage\\2019X");

		FlayFileHandler flayFileHandler = new FlayFileHandler();
		flayFileHandler.cloneFolder(srcFolder, destFolder);
	}

}
