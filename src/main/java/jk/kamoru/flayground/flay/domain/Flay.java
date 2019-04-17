package jk.kamoru.flayground.flay.domain;

import java.io.File;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.commons.lang3.math.NumberUtils;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jk.kamoru.flayground.info.domain.Video;
import lombok.Data;

@Data
public class Flay {

	public static final String MOVIE = "movie";
	public static final String SUBTI = "subtitles";
	public static final String COVER = "cover";
	public static final String CANDI = "candidate";

	// key
	String studio;
	String opus;
	String title;
	List<String> actressList;
	String release;

	// files
	Map<String, List<File>> files = new HashMap<>();

	Video video;

	public Flay() {
		files.put(MOVIE, new ArrayList<File>());
		files.put(SUBTI, new ArrayList<File>());
		files.put(COVER, new ArrayList<File>());
		files.put(CANDI, new ArrayList<File>());
	}

	public void addMovieFile(File file) {
		files.get(MOVIE).add(file);
	}

	public void addSubtitlesFile(File file) {
		files.get(SUBTI).add(file);
	}

	public void addCoverFile(File file) {
		files.get(COVER).add(file);
	}

	public void addCandidatesFile(File file) {
		files.get(CANDI).add(file);
	}

	public long getLastModified() {
		return NumberUtils.max(
				files.get(MOVIE).size() > 0 ? files.get(MOVIE).stream().max((f1, f2) -> NumberUtils.compare(f1.lastModified(), f2.lastModified())).get().lastModified() : -1,
				files.get(SUBTI).size() > 0 ? files.get(SUBTI).stream().max((f1, f2) -> NumberUtils.compare(f1.lastModified(), f2.lastModified())).get().lastModified() : -1,
				files.get(COVER).size() > 0 ? files.get(COVER).stream().max((f1, f2) -> NumberUtils.compare(f1.lastModified(), f2.lastModified())).get().lastModified() : -1,
				files.get(CANDI).size() > 0 ? files.get(CANDI).stream().max((f1, f2) -> NumberUtils.compare(f1.lastModified(), f2.lastModified())).get().lastModified() : -1
		);
	}

	public long getLength() {
		return (files.get(MOVIE) != null ? files.get(MOVIE).stream().mapToLong(f -> f.length()).sum() : -1)
			+  (files.get(SUBTI) != null ? files.get(SUBTI).stream().mapToLong(f -> f.length()).sum() : -1)
			+  (files.get(COVER) != null ? files.get(COVER).stream().mapToLong(f -> f.length()).sum() : -1);
	}

	public String getFullname() {
		return String.format("[%s][%s][%s][%s][%s]", studio, opus, title, getActressName(), release);
	}

	@JsonIgnore
	public String getActressName() {
		String actressNames = "";
		for (int i=0; i<actressList.size(); i++) {
			if (i > 0)
				actressNames += ", ";
			actressNames += actressList.get(i);
		}
		return actressNames;
	}

}
