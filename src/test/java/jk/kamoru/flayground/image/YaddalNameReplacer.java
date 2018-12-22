package jk.kamoru.flayground.image;

import java.io.File;
import java.util.Collection;

import org.apache.commons.io.FileUtils;

public class YaddalNameReplacer {

	public static void main(String[] args) {
		String prefix = " 은꼴릿사진  야떡.야딸(Yaddal)풀싸.웹툰.영상-";
		String path = "D:\\kAmOrU\\Pictures\\Girls\\yaddal";
		
		Collection<File> listFiles = FileUtils.listFiles(new File(path), null, true);
		System.out.println("listFiles: " + listFiles.size());
		for (File file : listFiles) {
			String fileName = file.getName();
			String parentPath = file.getParent();
			String replaceName = fileName.replace(prefix, "");
			File targetFile = new File(parentPath, replaceName);
			
			if (fileName.contains(prefix)) {
				System.out.format("%s => %s / %s %n", fileName, parentPath, replaceName);
				file.renameTo(targetFile);
			}
		}
	}

}
