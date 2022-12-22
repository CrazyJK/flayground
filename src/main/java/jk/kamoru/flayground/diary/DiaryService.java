package jk.kamoru.flayground.diary;

import java.util.Collection;
import java.util.List;
import java.util.Set;
import jk.kamoru.flayground.diary.Diary.Meta;

public interface DiaryService {

  Set<String> dates();

  Collection<Diary> list();

  Diary findByDate(String date);

  Diary save(Diary diary);

  List<Meta> meta();

}
