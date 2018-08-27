package jk.kamoru.flayground.video.domain;

import java.io.File;
import java.util.List;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class Video {
	
	// files
	List<File> videoList;
	List<File> subtitlesList;
	File coverFile;
	File infoFile;
	List<File> videoCandidates;

	// base info
	Studio studio;
	String opus;
	String title;
	List<Actress> actressList;
	String release;

	// extra info
	String overview;
	int playCount;
	int rank;
	List<Tag> tagList;
	
}
