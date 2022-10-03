package jk.kamoru.flayground.image;

import java.io.File;
import java.text.NumberFormat;
import java.util.Collection;
import java.util.stream.Collectors;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.io.filefilter.FalseFileFilter;
import org.apache.commons.io.filefilter.IOFileFilter;
import org.apache.commons.io.filefilter.TrueFileFilter;
import org.apache.commons.lang3.StringUtils;
import org.junit.jupiter.api.Test;

public class FileNameReplacer {

  static NumberFormat nf = NumberFormat.getNumberInstance();

  static {
    nf.setMinimumIntegerDigits(4);
    nf.setGroupingUsed(false);
  }

  void yaddalNameReplace() {
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

  static void imageNameReplace() {
    String basePath = "D:\\kAmOrU\\Pictures\\Girls\\actressX";
    File directory = new File(basePath);
    IOFileFilter fileFilter = FalseFileFilter.FALSE;
    IOFileFilter dirFilter = TrueFileFilter.TRUE;
    Collection<File> listDirs = FileUtils.listFilesAndDirs(directory, fileFilter, dirFilter);
    for (File dir : listDirs) {
      String dirName = dir.getName();
      if ("actress".equals(dirName))
        continue;
      System.out.format("%-60s / %s%n", dir, dirName);

      Collection<File> listFiles = FileUtils.listFiles(dir, null, false).stream().sorted((f1, f2) -> StringUtils.compare(f1.getName(), f2.getName())).collect(Collectors.toList());

      int count = 0;
      for (File file : listFiles) {
        String filename = file.getName();
        String extension = FilenameUtils.getExtension(filename);

        File newNameFile = new File(dir, dirName + " " + nf.format(++count) + "." + extension);
        System.out.format("%s => %s%n", filename, newNameFile.getName());

        file.renameTo(newNameFile);
      }
    }
  }

  @Test
  void test() {
    FileNameReplacer.imageNameReplace();
  }

}
