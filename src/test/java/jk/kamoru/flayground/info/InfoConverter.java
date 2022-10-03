package jk.kamoru.flayground.info;

import java.io.File;
import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.apache.commons.io.FileUtils;
import org.apache.commons.lang3.StringUtils;
import org.junit.jupiter.api.Test;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectWriter;
import jk.kamoru.flayground.info.domain.Actress;
import jk.kamoru.flayground.info.domain.Studio;
import lombok.Data;
import lombok.NoArgsConstructor;

public class InfoConverter {

  public static final String FAVORITE = "FAVORITE";
  public static final String NAME = "NAME";
  public static final String NEWNAME = "NEWNAME";
  public static final String LOCALNAME = "LOCALNAME";
  public static final String BIRTH = "BIRTH";
  public static final String BODYSIZE = "BODYSIZE";
  public static final String HEIGHT = "HEIGHT";
  public static final String DEBUT = "DEBUT";
  public static final String COMMENT = "COMMENT";
  public static final String HOMEPAGE = "HOMEPAGE";
  public static final String COMPANY = "COMPANY";

  final String[] srcPaths = new String[] {
      "/home/kamoru/workspace/FlayOn/crazy/Archive",
      "/home/kamoru/workspace/FlayOn/crazy/Candidate",
      "/home/kamoru/workspace/FlayOn/crazy/Cover",
      "/home/kamoru/workspace/FlayOn/crazy/Queue",
      "/home/kamoru/workspace/FlayOn/crazy/Seeds",
      "/home/kamoru/workspace/FlayOn/crazy/Stage",
      "/home/kamoru/workspace/FlayOn/crazy/Storage"
  };
  final String destPath = "/home/kamoru/workspace/FlayOn/crazy/Info";


  // final String[] srcPaths = new String[] {
  // "J:\\Crazy\\Archive",
  // "J:\\Crazy\\Cover",
  // "J:\\Crazy\\Stage",
  // "J:\\Crazy\\Storage",
  // "K:\\Crazy\\Cover",
  // "K:\\Crazy\\Stage",
  // "K:\\Crazy\\Storage"
  // };
  // final String destPath = "J:\\Crazy\\Info";

  void start() throws Exception {
    ObjectMapper mapper = new ObjectMapper();
    ObjectWriter writer = mapper.writerWithDefaultPrettyPrinter();

    Map<String, Studio> studioMap = new HashMap<>();
    Map<String, Actress> actressMap = new HashMap<>();
    Map<String, FromVideo> fromVideoMap = new HashMap<>();

    List<Tag> tagList = new ArrayList<>();

    for (String path : srcPaths) {
      Collection<File> listFiles = FileUtils.listFiles(new File(path), new String[] {"info", "actress", "studio", "data"}, true);
      System.out.format("Found %4s in %s%n", listFiles.size(), path);

      for (File file : listFiles) {
        if (FileUtils.readFileToByteArray(file).length == 0) {
          continue;
        }

        String suffix = StringUtils.substringAfterLast(file.getName(), ".");

        try {
          if ("actress".equals(suffix)) {
            Actress actress = loadActress(file);
            actressMap.put(actress.getName(), actress);
          } else if ("studio".equals(suffix)) {
            Studio studio = loadStudio(file);
            studioMap.put(studio.getName(), studio);
          } else if ("info".equals(suffix)) {
            FromVideo fromVideo = mapper.readValue(file, FromVideo.class);
            fromVideoMap.put(fromVideo.getOpus(), fromVideo);
          } else if ("tag.data".equals(file.getName())) {
            tagList = mapper.readValue(file, new TypeReference<List<Tag>>() {});
          }
        } catch (Exception e) {
          System.err.format("fail to read %s%n", file);
        }
      }
    }

    System.out.format("Studio  %4s found%n", studioMap.size());
    System.out.format("Actress %4s found%n", actressMap.size());
    System.out.format("Video   %4s found%n", fromVideoMap.size());
    System.out.format("Tag     %4s found%n", tagList.size());

    List<ToVideo> toVideoList = new ArrayList<>();
    for (FromVideo from : fromVideoMap.values()) {
      ToVideo to = new ToVideo();
      to.setOpus(from.opus);
      to.setPlay(from.playCount);
      to.setRank(from.rank);
      to.setComment(from.overview);
      to.setLastAccess(from.lastAccess);
      List<Integer> newTags = new ArrayList<>();
      if (from.tags != null) {
        for (Tag tag : from.tags) {
          newTags.add(tag.getId());
        }
      }
      to.setTags(newTags);
      toVideoList.add(to);
    }


    writer.writeValue(new File(destPath, "actress.json"), actressMap.values());
    writer.writeValue(new File(destPath, "studio.json"), studioMap.values());
    writer.writeValue(new File(destPath, "video.json"), toVideoList);
    writer.writeValue(new File(destPath, "tag.json"), tagList);

    System.out.println("Completed");
  }

  private Map<String, String> readFileToMap(File file) {
    try {
      Map<String, String> map = new HashMap<>();
      for (String str : Files.readAllLines(file.toPath())) {
        String[] strs = StringUtils.split(str, "=", 2);
        if (strs.length > 1)
          map.put(StringUtils.stripToEmpty(strs[0]), StringUtils.stripToEmpty(strs[1]));
      }
      return map;
    } catch (IOException e) {
      throw new IllegalStateException("file read error", e);
    }
  }

  private String trimToDefault(String str, String def) {
    String trim = StringUtils.trimToNull(str);
    return trim == null ? def : trim;
  }

  private Studio loadStudio(File file) {
    Map<String, String> info = readFileToMap(file);
    String filename = StringUtils.substringBeforeLast(file.getName(), ".");
    String infoName = info.get(NAME);
    if (StringUtils.isBlank(infoName) || !StringUtils.equals(filename, infoName))
      System.err.format("studio name not equals [%s] in info file %s%n", infoName, file);

    String name = infoName;
    String company = trimToDefault(info.get(COMPANY), "");
    URL homepage = makeURL(info.get(HOMEPAGE));

    Studio studio = new Studio(name);
    studio.setCompany(company);
    studio.setHomepage(homepage);
    return studio;
  }

  private Actress loadActress(File file) {
    Map<String, String> info = readFileToMap(file);
    String infoName = info.get(NAME);
    if (StringUtils.isBlank(infoName) || !StringUtils.contains(file.getName(), infoName)) {
      System.err.format("actress name not equals [%s] in info file %s%n", infoName, file);
    }
    String localName = trimToDefault(info.get(LOCALNAME), "");
    String birth = trimToDefault(info.get(BIRTH), "");
    String height = trimToDefault(info.get(HEIGHT), "0");
    String body = trimToDefault(info.get(BODYSIZE), "");
    String debut = trimToDefault(info.get(DEBUT), "0");
    String comment = trimToDefault(info.get(COMMENT), "");
    String favorite = trimToDefault(info.get(FAVORITE), "false");

    Actress actress = new Actress(infoName);
    actress.setLocalName(localName);
    actress.setBirth(birth);
    actress.setHeight(Integer.valueOf(height));
    actress.setBody(body);
    actress.setDebut(Integer.valueOf(debut));
    actress.setComment(comment);
    actress.setFavorite(Boolean.valueOf(favorite));

    return actress;
  }

  private URL makeURL(String string) {
    String str = StringUtils.trimToEmpty(string);
    if (StringUtils.isNotEmpty(str)) {
      if (!str.startsWith("http"))
        str = "http://" + str;
    } else {
      return null;
    }

    try {
      return new URL(str);
    } catch (MalformedURLException e) {
      System.err.format("Malformed URL [%s]: %s%n", str, e.getMessage());
      return null;
    }
  }

  @Test
  void main() throws Exception {
    // InfoConverter converter = new InfoConverter();
    // converter.start();
  }

}


@Data
@NoArgsConstructor
class Tag {
  int id;
  String name;
  String description = "";
  @JsonIgnore int count;

  public void setDescription(String desc) {
    this.description = desc == null ? "" : desc;
  }
}


@Data
@NoArgsConstructor
class FromVideo {
  String opus;
  Integer playCount = 0;
  Integer rank = 0;
  String overview = "";
  Date lastAccess = new Date(0);
  List<Tag> tags = new ArrayList<>();
}


@Data
@NoArgsConstructor
class ToVideo {
  String opus;
  int play = 0;
  int rank = 0;
  String comment = "";
  Date lastAccess = new Date(0);
  List<Integer> tags = new ArrayList<>();

  public void setOpus(String opus) {
    this.opus = opus;
  }

  public void setPlay(Integer play) {
    this.play = play == null ? 0 : play;
  }

  public void setRank(Integer rank) {
    this.rank = rank == null ? 0 : rank;
  }

  public void setComment(String comment) {
    this.comment = comment == null ? "" : comment;
  }

  public void setLastAccess(Date lastAccess) {
    this.lastAccess = lastAccess == null ? new Date(0) : lastAccess;
  }

  public void setTags(List<Integer> tags) {
    this.tags = tags;
  }
}
