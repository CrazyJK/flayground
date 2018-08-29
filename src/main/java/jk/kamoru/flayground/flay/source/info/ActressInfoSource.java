package jk.kamoru.flayground.flay.source.info;

import java.io.File;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;

import jk.kamoru.flayground.flay.domain.info.Actress;

@Repository
public class ActressInfoSource extends JsonInfoSource<Actress, String> {

	private static final String FILE_NAME = "actress.json";

	@Value("${path.info}") String infoPath;

	@Override
	File getInfoFile() {
		return new File(infoPath, FILE_NAME);
	}

}
