package jk.kamoru.flayground.flay.domain.info;

import java.util.Date;
import java.util.List;

import jk.kamoru.flayground.flay.domain.Tag;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class VideoInfo implements Info {

	long id;
	String opus;
	Integer playCount;
	Integer rank;
	String overview;
	Date lastAccess;
	List<Tag> tags;

}
