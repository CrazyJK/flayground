package jk.kamoru.ground.info.source;

import java.io.File;
import java.util.concurrent.CopyOnWriteArrayList;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.fasterxml.jackson.core.type.TypeReference;

import jk.kamoru.ground.GroundProperties;
import jk.kamoru.ground.Ground;
import jk.kamoru.ground.info.domain.Studio;

@Repository
public class StudioInfoSource extends InfoSourceJsonAdapter<Studio, String> {

  @Autowired
  GroundProperties properties;

  @Override
  File getInfoFile() {
    return new File(properties.getInfoPath(), Ground.InfoFilename.STUDIO);
  }

  @Override
  TypeReference<CopyOnWriteArrayList<Studio>> getTypeReference() {
    return new TypeReference<CopyOnWriteArrayList<Studio>>() {
    };
  }

  @Override
  Studio newInstance(String key) {
    return new Studio(key);
  }

}
