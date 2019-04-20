package jk.kamoru.flayground.info.source;

import java.io.File;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.fasterxml.jackson.core.type.TypeReference;

import jk.kamoru.flayground.FlayProperties;
import jk.kamoru.flayground.Flayground;
import jk.kamoru.flayground.info.domain.Actress;

@Repository
public class ActressInfoSource extends InfoSourceJsonAdapter<Actress, String> {

	@Autowired FlayProperties flayProperties;

	@Override
	File getInfoFile() {
		return new File(flayProperties.getInfoPath(), Flayground.InfoFilename.ACTRESS);
	}

	@Override
	TypeReference<List<Actress>> getTypeReference() {
		return new TypeReference<List<Actress>>() {};
	}

	@Override
	Actress newInstance(String actressname) {
		return new Actress(actressname);
	}

}
