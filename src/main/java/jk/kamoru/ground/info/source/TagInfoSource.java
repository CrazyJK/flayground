package jk.kamoru.ground.info.source;

import java.io.File;
import java.util.concurrent.CopyOnWriteArrayList;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.fasterxml.jackson.core.type.TypeReference;

import jk.kamoru.ground.GroundProperties;
import jk.kamoru.ground.Ground;
import jk.kamoru.ground.info.domain.Tag;

@Repository
public class TagInfoSource extends InfoSourceJsonAdapter<Tag, Integer> {

  @Autowired
  GroundProperties properties;

  @Override
  File getInfoFile() {
    return new File(properties.getInfoPath(), Ground.InfoFilename.TAG);
  }

  @Override
  TypeReference<CopyOnWriteArrayList<Tag>> getTypeReference() {
    return new TypeReference<CopyOnWriteArrayList<Tag>>() {
    };
  }

  @Override
  Tag newInstance(Integer key) {
    return new Tag(key);
  }

}
