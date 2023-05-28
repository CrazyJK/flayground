package jk.kamoru.flayground.info.source;

import java.io.File;
import java.util.concurrent.CopyOnWriteArrayList;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.fasterxml.jackson.core.type.TypeReference;

import jk.kamoru.flayground.FlayProperties;
import jk.kamoru.flayground.Flayground;
import jk.kamoru.flayground.info.domain.Tag;

@Repository
public class TagInfoSource extends InfoSourceJsonAdapter<Tag, Integer> {

  @Autowired
  FlayProperties flayProperties;

  @Override
  File getInfoFile() {
    return new File(flayProperties.getInfoPath(), Flayground.InfoFilename.TAG);
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
