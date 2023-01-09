package jk.kamoru.flayground.flay.service;

import java.io.BufferedWriter;
import java.io.File;
import java.io.IOException;
import java.lang.ProcessBuilder.Redirect;
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import org.apache.commons.io.FileUtils;
import org.apache.commons.lang3.ArrayUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import jk.kamoru.flayground.FlayProperties;
import jk.kamoru.flayground.Flayground;
import jk.kamoru.flayground.base.web.socket.queue.data.QueueDataService;
import jk.kamoru.flayground.base.web.socket.topic.message.TopicMessageService;
import jk.kamoru.flayground.flay.FlayNotfoundException;
import jk.kamoru.flayground.flay.domain.Flay;
import jk.kamoru.flayground.flay.source.FlaySource;
import jk.kamoru.flayground.history.domain.History;
import jk.kamoru.flayground.history.domain.History.Action;
import jk.kamoru.flayground.history.service.HistoryService;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class BatchExecutor {

  public static enum Option {
    /** delete Lower Score Video */
    S("delete Lower Score Video"),
    /** delete Lower Rank Video */
    R("delete Lower Rank Video");

    private String desc;

    private Option(String desc) {
      this.desc = desc;
    }
  }

  public static enum Operation {
    /** InstanceVideoSource */
    I,
    /** ArchiveVideoSource */
    A,
    /** Backup */
    B
  }

  @Autowired FlayProperties flayProperties;
  @Autowired FlaySource instanceFlaySource;
  @Autowired FlaySource archiveFlaySource;
  @Autowired HistoryService historyService;
  @Autowired ScoreCalculator scoreCalculator;
  @Autowired FlayFileHandler flayFileHandler;

  @Autowired TopicMessageService topicMessageService;
  @Autowired QueueDataService queueDataService;

  public void reload() {
    log.info("[reload]");
    instanceFlaySource.load();
    topicMessageService.sendFromServerToAll("Reload", "Instance Source");
  }

  public Boolean getOption(Option type) {
    switch (type) {
      case S:
        return flayProperties.isDeleteLowerScore();
      default:
        throw new IllegalArgumentException("unknown batch option");
    }
  }

  public Boolean toggleOption(Option type) {
    switch (type) {
      case S:
        return flayProperties.negateDeleteLowerScore();
      default:
        throw new IllegalArgumentException("unknown batch option");
    }
  }

  public void startBatch(Operation operation) {
    switch (operation) {
      case I:
        instanceBatch();
        break;
      case A:
        archiveBatch();
        break;
      case B:
        backup();
        break;
      default:
        throw new IllegalArgumentException("unknown batch operation");
    }
  }

  public Map<String, List<Flay>> checkBatch(Operation operation) {
    switch (operation) {
      case I:
        return instanceCheck();
      default:
        throw new IllegalArgumentException("unknown batch operation");
    }
  }

  protected void instanceBatch() {
    topicMessageService.sendFromServerToAll("Batch", "start Instance Source");
    queueDataService.queueFromServerToCurrentUser("batch", "Instance Source");

    queueDataService.queueFromServerToCurrentUser("batch", "[deleteLowerRank]");
    deleteLowerRank();

    if (flayProperties.isDeleteLowerScore()) {
      queueDataService.queueFromServerToCurrentUser("batch", "[deleteLowerScore]");
      deleteLowerScore();
    }

    queueDataService.queueFromServerToCurrentUser("batch", "[assembleFlay]");
    assembleFlay();

    queueDataService.queueFromServerToCurrentUser("batch", "[deleteEmptyFolder]");
    deleteEmptyFolder(ArrayUtils.addAll(flayProperties.getStagePaths(), flayProperties.getCoverPath(),
        flayProperties.getStoragePath()));

    queueDataService.queueFromServerToCurrentUser("batch", "[instanceFlaySource.load]");
    instanceFlaySource.load();
    topicMessageService.sendFromServerToAll("Batch", "end Instance Source");
  }

  protected Map<String, List<Flay>> instanceCheck() {
    Map<String, List<Flay>> map = new HashMap<>();
    // check delete lower rank
    map.put("rank", listLowerRank());
    // check delete lower score
    map.put("score", listLowerScore());
    return map;
  }

  protected void archiveBatch() {
    topicMessageService.sendFromServerToAll("Batch", "start Archive Source");
    queueDataService.queueFromServerToCurrentUser("batch", "Archive Source");

    queueDataService.queueFromServerToCurrentUser("batch", "[relocateArchiveFile]");
    log.info("[relocateArchiveFile]");
    for (Flay flay : archiveFlaySource.list()) {
      String yyyyMM = getArchiveFolderName(flay);
      File destDir = new File(flayProperties.getArchivePath(), yyyyMM);
      for (Entry<String, List<File>> entry : flay.getFiles().entrySet()) {
        for (File file : entry.getValue()) {
          String parentName = file.getParentFile().getName();
          if (StringUtils.equals(parentName, yyyyMM)) {
            // ok. normal position
          } else {
            log.info("move {} to {}", file, destDir);
            flayFileHandler.moveFileToDirectory(file, destDir);
          }
        }
      }
    }

    queueDataService.queueFromServerToCurrentUser("batch", "[deleteEmptyFolder]");
    deleteEmptyFolder(flayProperties.getArchivePath());

    queueDataService.queueFromServerToCurrentUser("batch", "[archiveFlaySource.load]");
    archiveFlaySource.load();
    topicMessageService.sendFromServerToAll("Batch", "end Archive Source");
  }

  void deleteLowerRank() {
    log.info("[deleteLowerRank]");
    listLowerRank().forEach((flay) -> archiving(flay, Option.R));
  }

  void deleteLowerScore() {
    log.info("[deleteLowerScore]");
    listLowerScore().forEach((flay) -> archiving(flay, Option.S));
  }

  private List<Flay> listLowerRank() {
    List<Flay> lowerRankList = new ArrayList<>();
    for (Flay flay : instanceFlaySource.list()) {
      if (flay.getVideo().getRank() < 0) {
        lowerRankList.add(flay);
      }
    }
    return lowerRankList;
  }

  private List<Flay> listLowerScore() {
    log.info(String.format("[listLowerScore] limit   %4s GB", flayProperties.getStorageLimit()));
    log.info(String.format("[listLowerScore] total   %4s GB",
        instanceFlaySource.list().stream().mapToLong(f -> f.getLength()).sum() / FileUtils.ONE_GB));
    List<Flay> lowerScoreList = new ArrayList<>();
    final long storageSize = flayProperties.getStorageLimit() * FileUtils.ONE_GB;
    long lengthSum = 0;
    Collection<Flay> scoreReverseSortedFlayList = scoreCalculator.listOrderByScoreDesc(instanceFlaySource.list());
    for (Flay flay : scoreReverseSortedFlayList) {
      lengthSum += flay.getLength();
      if (lengthSum > storageSize) {
        lowerScoreList.add(flay);
      }
    }
    log.info(String.format("[listLowerScore] checked %4s GB", lengthSum / FileUtils.ONE_GB));
    return lowerScoreList;
  }

  void assembleFlay() {
    log.info("[assembleFlay]");

    final String storagePath;
    final String[] stagePaths;
    final String coverPath;
    try {
      storagePath = flayProperties.getStoragePath().getCanonicalPath();
      stagePaths = new String[flayProperties.getStagePaths().length];
      for (int i = 0; i < flayProperties.getStagePaths().length; i++) {
        stagePaths[i] = flayProperties.getStagePaths()[i].getCanonicalPath();
      }
      coverPath = flayProperties.getCoverPath().getCanonicalPath();
    } catch (IOException e) {
      throw new IllegalStateException("assembleFlay CanonicalPath error", e);
    }

    for (Flay flay : instanceFlaySource.list()) {
      if (flay.isArchive()) {
        continue;
      }

      // 커버 파일 없으면, 아카이브에서 커버 자막 파일 다시 매핑. 휴지통 복원일 경우
      File delegatePath = getDelegatePath(flay, storagePath, stagePaths, coverPath);
      for (Entry<String, List<File>> entry : flay.getFiles().entrySet()) {
        String key = entry.getKey();
        if (Flay.CANDI.equals(key)) {
          continue;
        }
        // if missing Cover, find in archive
        if (Flay.COVER.equals(key) && (entry.getValue() == null || entry.getValue().isEmpty())) {
          try {
            Flay archiveFlay = archiveFlaySource.get(flay.getOpus());
            List<File> coverFiles = archiveFlay.getFiles().get(Flay.COVER);
            if (coverFiles != null && coverFiles.size() > 0) {
              flay.getFiles().get(Flay.COVER).add(coverFiles.get(0));
              log.info("add Cover {}", coverFiles.get(0));
              queueDataService.queueFromServerToCurrentUser("batch", "add Cover " + coverFiles.get(0));
            }
          } catch (FlayNotfoundException ignore) {
          }
        }
        // if subtitles not exists, find in archive or subtitles folder
        if (Flay.SUBTI.equals(key) && (entry.getValue() == null || entry.getValue().isEmpty())) {
          try {
            Flay archiveFlay = archiveFlaySource.get(flay.getOpus());
            List<File> subtitlesFiles = archiveFlay.getFiles().get(Flay.SUBTI);
            if (subtitlesFiles != null && subtitlesFiles.size() > 0) {
              flay.getFiles().get(Flay.SUBTI).addAll(subtitlesFiles);
              log.info("add subtiles {}", subtitlesFiles);
              queueDataService.queueFromServerToCurrentUser("batch", "add subtiles " + subtitlesFiles);
            }
          } catch (FlayNotfoundException ignore) {
          }
        }
      }

      // assemble
      for (Entry<String, List<File>> entry : flay.getFiles().entrySet()) {
        List<File> value = entry.getValue();
        for (File file : value) {
          if (!delegatePath.equals(file.getParentFile())) {
            final String message = String.format("move [%-10s r%s %7s] %-20s => %s / %s",
                flay.getOpus(),
                flay.getVideo().getRank(),
                flayFileHandler.prettyFileLength(file.length()),
                file.getParent(),
                delegatePath,
                file.getName());
            log.info(message);
            queueDataService.queueFromServerToCurrentUser("batch", message);
            flayFileHandler.moveFileToDirectory(file, delegatePath);
          }
        }
      }
    }
  }

  /**
   * 하위 폴더 전체에서 파일이 없는 폴더 삭제
   *
   * @param emptyManagedPaths
   */
  void deleteEmptyFolder(File... emptyManagedPaths) {
    log.info("[deleteEmptyFolder]");
    for (File managedPath : emptyManagedPaths) {
      log.info("  scanning...   {}", managedPath);
      Path path = managedPath.toPath();
      Collection<Path> listDirs = flayFileHandler.listDirectory(path);
      for (Path dir : listDirs) {
        if (dir.equals(path)) {
          continue;
        }

        if (flayFileHandler.isEmptyDirectory(dir)) {
          log.info("    empty directory delete {}", dir);
          flayFileHandler.deleteDirectory(dir.toFile());
        }
      }
    }
  }

  /**
   * flay 파일이 있어야될 위치
   *
   * @param flay
   * @param storagePath
   * @param stagePaths
   * @param coverPath
   * @return
   * @throws IOException
   */
  private File getDelegatePath(Flay flay, String storagePath, String[] stagePaths, String coverPath) {
    int movieSize = flay.getFiles().get(Flay.MOVIE).size();
    int coverSize = flay.getFiles().get(Flay.COVER).size();

    try {
      if (movieSize > 0) {
        String flayMovieFileFolder = flay.getFiles().get(Flay.MOVIE).get(0).getParentFile().getCanonicalPath();
        int rank = flay.getVideo().getRank();
        if (rank > 0) { // storage에 [studio]로 있어야 한다
          return new File(storagePath, flay.getStudio());
        } else if (rank == 0) { // stage에 있어야 한다
          // 같은 디스크의 stage 찾아
          String root = flayMovieFileFolder.substring(0, 1);
          String stagePath = null;
          for (String path : stagePaths) {
            if (path.startsWith(root)) {
              stagePath = path;
              break;
            }
          }
          // stage/[연도]
          if (stagePath != null) {
            return new File(stagePath, flay.getRelease().substring(0, 4));
          }
        } else { // rank < 0 있으면 안되지

        }
      } else if (coverSize > 0) { // 비디오 없는 파일은 cover 로
        return new File(coverPath, flay.getRelease().substring(0, 4));
      }
    } catch (IOException e) {
      throw new IllegalStateException("getDelegatePath CanonicalPath error", e);
    }

    log.info("Not determine delegate path, return to Queue path. {}", flay.getOpus());
    return flayProperties.getQueuePath();
  }

  /**
   * archive 폴더명 yyyy-MM 형식
   *
   * @param flay
   * @return
   */
  private String getArchiveFolderName(Flay flay) {
    return StringUtils.substring(flay.getRelease(), 0, 4) + "-" + StringUtils.substring(flay.getRelease(), 5, 7);
  }

  /**
   * 커버, 자막은 아카이브 폴더로 이동<br>
   * 그외 파일은 제거.(삭제 또는 휴지통)
   *
   * @param flay
   * @param s
   */
  private void archiving(Flay flay, Option option) {
    String yyyyMM = getArchiveFolderName(flay);
    File archiveDir = new File(flayProperties.getArchivePath(), yyyyMM);
    for (Entry<String, List<File>> entry : flay.getFiles().entrySet()) {
      String key = entry.getKey();
      for (File file : entry.getValue()) {
        if (Flay.COVER.equals(key) || Flay.SUBTI.equals(key)) {
          log.info("will be move {} to {}", file, archiveDir);
          queueDataService.queueFromServerToCurrentUser("batch", "  will be move " + file + " to " + archiveDir);
          flayFileHandler.moveFileToDirectory(file, archiveDir);
        } else {
          log.info("will be delete {}", file);
          queueDataService.queueFromServerToCurrentUser("batch", "  will be delete " + file);
          flayFileHandler.deleteFile(file);
        }
      }
    }
    flay.setArchive(true);
    historyService.save(Action.DELETE, flay, option.desc);
  }

  public synchronized void backup() {
    if (!flayProperties.getBackupPath().exists()) {
      log.warn("Backup path is wrong");
      return;
    }
    String message;

    message = String.format("[Backup] START %s", flayProperties.getBackupPath());
    log.info(message);
    queueDataService.queueFromServerToCurrentUser("batch", message);

    final String CSV_HEADER = "Studio,Opus,Title,Actress,Released,Rank,Fullname";
    final String CSV_FORMAT = "\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",%s,\"%s\"";

    final String BACKUP_INSTANCE_JAR_FILENAME = flayProperties.getBackup().getInstanceJarFilename();
    final String BACKUP_ARCHIVE_JAR_FILENAME = flayProperties.getBackup().getArchiveJarFilename();
    final String BACKUP_INSTANCE_CSV_FILENAME = flayProperties.getBackup().getInstanceCsvFilename();
    final String BACKUP_ARCHIVE_CSV_FILENAME = flayProperties.getBackup().getArchiveCsvFilename();

    File backupInstanceJarFile = new File(flayProperties.getBackupPath(), BACKUP_INSTANCE_JAR_FILENAME);
    File backupArchiveJarFile = new File(flayProperties.getBackupPath(), BACKUP_ARCHIVE_JAR_FILENAME);
    File backupRootPath = new File(flayProperties.getQueuePath(), "InstanceBackupTemp");
    File backupInstanceFilePath = new File(backupRootPath, "instanceFiles");

    flayFileHandler.createDirectory(backupRootPath);
    flayFileHandler.cleanDirectory(backupRootPath);
    flayFileHandler.createDirectory(backupInstanceFilePath);

    // video list backup to csv
    Collection<Flay> instanceFlayList = instanceFlaySource.list();
    Collection<Flay> archiveFlayList = archiveFlaySource.list();
    List<History> historyList = historyService.list();
    List<String> instanceCsvDataList = new ArrayList<>();
    List<String> archiveCsvDataList = new ArrayList<>();

    // instance info
    message = String.format("[Backup] Write instance csv %s to %s", BACKUP_INSTANCE_CSV_FILENAME, backupRootPath);
    log.info(message);
    queueDataService.queueFromServerToCurrentUser("batch", message);
    instanceCsvDataList.add(CSV_HEADER);
    for (Flay flay : instanceFlayList) {
      instanceCsvDataList.add(String.format(CSV_FORMAT,
          flay.getStudio(), flay.getOpus(), flay.getTitle(), flay.getActressName(), flay.getRelease(),
          flay.getVideo().getRank(), flay.getFullname()));
    }
    writeFileWithUTF8BOM(new File(backupRootPath, BACKUP_INSTANCE_CSV_FILENAME), instanceCsvDataList);

    // archive info
    message = String.format("[Backup] Write archive  csv %s  to %s", BACKUP_ARCHIVE_CSV_FILENAME, backupRootPath);
    log.info(message);
    queueDataService.queueFromServerToCurrentUser("batch", message);
    archiveCsvDataList.add(CSV_HEADER);
    for (Flay flay : archiveFlayList) {
      archiveCsvDataList.add(String.format(CSV_FORMAT,
          flay.getStudio(), flay.getOpus(), flay.getTitle(), flay.getActressName(), flay.getRelease(), "",
          flay.getFullname()));
    }
    for (History history : historyList) {
      String opus = history.getOpus();
      boolean foundInArchive = false;
      for (Flay flay : archiveFlayList) {
        if (flay.getOpus().equals(opus)) {
          foundInArchive = true;
          break;
        }
      }
      if (!foundInArchive)
        archiveCsvDataList.add(String.format(CSV_FORMAT, "", history.getOpus(), "", "", "", "", history.getDesc()));
    }
    writeFileWithUTF8BOM(new File(backupRootPath, BACKUP_ARCHIVE_CSV_FILENAME), archiveCsvDataList);

    // Info folder copy
    message = String.format("[Backup] Copy Info folder %s to %s", flayProperties.getInfoPath(), backupRootPath);
    log.info(message);
    queueDataService.queueFromServerToCurrentUser("batch", message);
    flayFileHandler.copyDirectoryToDirectory(flayProperties.getInfoPath(), backupRootPath);

    // Instance - Cover, Subtitles file copy
    message = String.format("[Backup] Copy Instance file to %s", backupInstanceFilePath);
    log.info(message);
    queueDataService.queueFromServerToCurrentUser("batch", message);
    for (Flay flay : instanceFlayList) {
      for (File file : flay.getFiles().get(Flay.COVER))
        flayFileHandler.copyFileToDirectory(file, backupInstanceFilePath);
      for (File file : flay.getFiles().get(Flay.SUBTI))
        flayFileHandler.copyFileToDirectory(file, backupInstanceFilePath);
    }

    message = "[Backup] Compress Instance folder";
    log.info(message);
    queueDataService.queueFromServerToCurrentUser("batch", message);
    compress(backupInstanceJarFile, backupRootPath);

    message = "[Backup] Compress Archive folder";
    log.info(message);
    queueDataService.queueFromServerToCurrentUser("batch", message);
    compress(backupArchiveJarFile, flayProperties.getArchivePath());

    message = String.format("[Backup] Delete Instance Backup Temp folder %s", backupRootPath);
    log.info(message);
    queueDataService.queueFromServerToCurrentUser("batch", message);
    flayFileHandler.deleteDirectory(backupRootPath);

    message = "[Backup] END";
    log.info(message);
    queueDataService.queueFromServerToCurrentUser("batch", message);

    topicMessageService.sendFromServerToCurrentUser("Backup", "Backup completed");
  }

  private void writeFileWithUTF8BOM(File file, Collection<String> lines) {
    try (BufferedWriter bufferedWriter = Files.newBufferedWriter(file.toPath(), Charset.forName(Flayground.ENCODING),
        StandardOpenOption.CREATE, StandardOpenOption.WRITE)) {
      bufferedWriter.write(65279); // UTF-8의 BOM인 "EF BB BF"를 UTF-16BE 로 변환
      for (String line : lines) {
        bufferedWriter.write(line);
        bufferedWriter.newLine();
      }
      bufferedWriter.flush();
    } catch (IOException e) {
      throw new IllegalStateException("Fail to writeFileWithUTF8BOM", e);
    }
  }

  private void compress(File destJarFile, File targetFolder) {
    // jar options
    // -c 새 아카이브를 생성합니다.
    // -v 표준 출력에 상세 정보 출력을 생성합니다.
    // -f 아카이브 파일 이름을 지정합니다.
    // -0 저장 전용: ZIP 압축을 사용하지 않습니다.
    // -M 항목에 대해 Manifest 파일을 생성하지 않습니다.
    List<String> commands = Arrays.asList("jar", "cvf0M", destJarFile.getAbsolutePath(), "-C",
        targetFolder.getAbsolutePath(), ".");
    File logFile = new File(flayProperties.getQueuePath(),
        destJarFile.getName() + "." + Flayground.Format.Date.YYYY_MM_DD.format(new Date()) + ".log");
    ProcessBuilder builder = new ProcessBuilder(commands);
    builder.redirectOutput(Redirect.to(logFile));
    builder.redirectError(Redirect.INHERIT);
    try {
      String message = "         jar " + commands;
      log.info(message);
      queueDataService.queueFromServerToCurrentUser("batch", message);

      Process process = builder.start();
      process.waitFor();

      message = "         completed " + flayFileHandler.prettyFileLength(destJarFile.length());
      log.info(message);
      queueDataService.queueFromServerToCurrentUser("batch", message);
    } catch (IOException | InterruptedException e) {
      throw new IllegalStateException("Fail to jar", e);
    }
  }

}
