package jk.kamoru.flayground.flay.source.info;

import java.io.File;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;

import jk.kamoru.flayground.flay.domain.info.Tag;

@Repository
public class TagInfoSource extends JsonInfoSource<Tag, String> {

	private static final String FILE_NAME = "tag.json";
	
	@Value("${path.info}") String infoPath;

	@Override
	File getInfoFile() {
		return new File(infoPath, FILE_NAME);
	}

}
