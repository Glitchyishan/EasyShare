import 'package:json_annotation/json_annotation.dart';

part 'message.g.dart';

@JsonSerializable()
class Message {
  final String id;
  final String message;
  @JsonKey(name: 'paid_by')
  final String? paidBy;
  @JsonKey(name: 'created_at')
  final String createdAt;

  Message({
    required this.id,
    required this.message,
    this.paidBy,
    required this.createdAt,
  });

  factory Message.fromJson(Map<String, dynamic> json) =>
      _$MessageFromJson(json);
  Map<String, dynamic> toJson() => _$MessageToJson(this);
}
