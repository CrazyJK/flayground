package jk.kamoru.flayground.flay.domain.info;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TagInfo implements Info {

	long id;
	String name;
	String description;

}
