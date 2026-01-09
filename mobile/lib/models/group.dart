import 'package:json_annotation/json_annotation.dart';

part 'group.g.dart';

@JsonSerializable()
class Group {
  @JsonKey(name: 'group_id')
  final String id;
  final String name;
  @JsonKey(name: 'last_activity')
  final String lastActivity;

  Group({
    required this.id,
    required this.name,
    required this.lastActivity,
  });

  factory Group.fromJson(Map<String, dynamic> json) => _$GroupFromJson(json);
  Map<String, dynamic> toJson() => _$GroupToJson(this);
}
