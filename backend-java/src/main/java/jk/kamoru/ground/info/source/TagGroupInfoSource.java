package jk.kamoru.ground.info.source;

import java.io.File;
import java.util.concurrent.CopyOnWriteArrayList;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.fasterxml.jackson.core.type.TypeReference;

import jk.kamoru.ground.Ground;
import jk.kamoru.ground.GroundProperties;
import jk.kamoru.ground.info.domain.TagGroup;

@Repository
public class TagGroupInfoSource extends InfoSourceJsonAdapter<TagGroup, String> {

  @Autowired
  GroundProperties properties;

  @Override
  File getInfoFile() {
    return new File(properties.getInfoPath(), Ground.InfoFilename.TAG_GROUP);
  }

  @Override
  TypeReference<CopyOnWriteArrayList<TagGroup>> getTypeReference() {
    return new TypeReference<CopyOnWriteArrayList<TagGroup>>() {
    };
  }

  @Override
  TagGroup newInstance(String key) {
    return new TagGroup(key);
  }

}
